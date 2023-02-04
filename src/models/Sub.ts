import mongoose from 'mongoose';

export interface Sub {
	id: string,
	episodeId: string,
	lang: string,
	url: string
}

const SubSchema = new mongoose.Schema<Sub>({
	id: {
		type: String,
		maxlength: 40,
		required: true,
		index: true
	},
	episodeId: {
		type: String,
		maxlength: 40,
		required: true,
		index: true
	},
	lang: {
		type: String,
		maxlength: 40,
		required: true,
	},
	url: {
		type: String,
		maxlength: 40,
		required: true,
	},

});
const SubModel = mongoose.model("Sub", SubSchema);
export { SubModel };
